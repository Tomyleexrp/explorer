import React from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import Sequence from '../../shared/components/Sequence'
import { transactionTypes } from '../../shared/components/Transaction'
import { useLanguage } from '../../shared/hooks'

const TransactionDescription = (props) => {
  const language = useLanguage()
  const { t } = useTranslation()
  const { data } = props
  let body = null

  if (!data || !data.tx) {
    return null
  }

  // Locate the component description section of the detail tab that is unique per TransactionType.
  const DescriptionComponent =
    transactionTypes[data.tx.TransactionType]?.Description

  if (DescriptionComponent) {
    body = <DescriptionComponent data={data} />
  }

  return (
    <div className="detail-section">
      <div className="title">{t('description')}</div>
      <div>
        {t('transaction_sequence')}
        <b>
          {' '}
          <Sequence
            sequence={data.tx.Sequence}
            ticketSequence={data.tx.TicketSequence}
            account={data.tx.Account}
            addContextHelp
          />
        </b>
      </div>
      {body}
    </div>
  )
}

TransactionDescription.propTypes = {
  data: PropTypes.objectOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
      PropTypes.number,
      PropTypes.array,
    ]),
  ).isRequired,
}

export default TransactionDescription
